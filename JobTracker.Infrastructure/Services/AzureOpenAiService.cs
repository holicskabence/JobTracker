#pragma warning disable OPENAI001

using System.ClientModel;
using System.Text.Json;
using JobTracker.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using OpenAI;
using OpenAI.Chat;

namespace JobTracker.Infrastructure.Services;

public sealed class AzureOpenAiService : IAzureOpenAiService
{
    private readonly ChatClient _client;

    public AzureOpenAiService(IConfiguration configuration)
    {
        var endpoint = configuration["AzureOpenAI:Endpoint"]!;
        var apiKey = configuration["AzureOpenAI:ApiKey"]!;
        var deploymentName = configuration["AzureOpenAI:DeploymentName"]!;

        _client = new ChatClient(
            model: deploymentName,
            credential: new ApiKeyCredential(apiKey),
            options: new OpenAIClientOptions
            {
                Endpoint = new Uri(endpoint)
            });
    }

    public async Task<(string Feedback, string Verdict)> EvaluateAnswerAsync(
        string question, string hint, string sampleAnswer,
        string userAnswer, string? customPrompt)
    {
        var extraInstruction = string.IsNullOrWhiteSpace(customPrompt)
            ? string.Empty
            : "\n\nKülönleges értékelési szempont a felhasználótól: " + customPrompt.Trim();

        var systemContent =
     "You are a senior software engineer and experienced technical interviewer.\n" +
     "Your task is to evaluate a candidate's answer to an interview question.\n\n" +

     "Respond ONLY in English.\n" +
     "Provide concise and professional feedback (3-5 sentences).\n" +
     "Evaluate:\n" +
     "1. Technical correctness\n" +
     "2. Completeness of the answer\n" +
     "3. Communication quality\n" +
     "4. English grammar and wording\n\n" +

     "If the candidate made grammar, vocabulary, or phrasing mistakes, briefly point them out and suggest a better way to express the idea.\n" +
     "If important technical details are missing, briefly explain what should have been mentioned.\n" +
     "Be honest and interview-focused, not overly positive.\n\n" +

     "Return ONLY valid JSON in this format:\n" +
     "{\"feedback\":\"<short evaluation>\",\"verdict\":\"<correct | incorrect>\"}\n\n" +

     "Verdict rules:\n" +
     "- 'correct' if the answer is mostly technically accurate and covers the key points.\n" +
     "- 'incorrect' if the answer contains significant mistakes, missing core concepts, or major inaccuracies."
     + extraInstruction;

        var userContent =
            "Kérdés: " + question + "\n\n" +
            "Kulcspontok/Tipp: " + hint + "\n\n" +
            "Várható mintaválasz: " + sampleAnswer + "\n\n" +
            "A jelölt válasza: " + userAnswer;

        var messages = new ChatMessage[]
        {
            new SystemChatMessage(systemContent),
            new UserChatMessage(userContent)
        };

        var completion = await _client.CompleteChatAsync(messages, new ChatCompletionOptions
        {
            MaxOutputTokenCount = 600,
            ResponseFormat = ChatResponseFormat.CreateJsonObjectFormat()
        });

        var raw = completion.Value.Content.FirstOrDefault()?.Text ?? "{}";

        try
        {
            using var doc = JsonDocument.Parse(raw);
            var root = doc.RootElement;
            var feedback = root.TryGetProperty("feedback", out var fb) ? fb.GetString() ?? string.Empty : raw;
            var verdict = root.TryGetProperty("verdict", out var v) ? v.GetString() ?? "jó" : "jó";
            return (feedback, NormalizeVerdict(verdict));
        }
        catch
        {
            return (raw, "jó");
        }
    }

    private static string NormalizeVerdict(string verdict)
    {
        return verdict?.Trim().ToLowerInvariant() switch
        {
            "correct" => "correct",
            "incorrect" => "incorrect",
            _ => "incorrect"
        };
    }
}
