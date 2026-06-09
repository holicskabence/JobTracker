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
            "Te egy tapasztalt interjú coach vagy, aki álláskeresőknek segít felkészülni az interjúkra.\n" +
            "Értékeld a jelölt válaszát az interjúkérdésre. Adj konstruktív, bátorító visszajelzést MAGYARUL.\n" +
            "A visszajelzés tartalmazzon:\n" +
            "1. Amit jól csinált (erősségek)\n" +
            "2. Mit lehetne javítani vagy kibővíteni\n" +
            "3. Rövid összefoglalót arról, mennyire volt teljes a válasz\n\n" +
            "Legyél tömör (4-6 mondat), barátságos de őszinte. Markdown formázást NE használj." +
            extraInstruction + "\n\n" +
            "Válaszolj kizárólag JSON formátumban: {\"feedback\": \"<4-6 mondatos értékelés>\", \"verdict\": \"<helyes | helytelen>\"}\n\n" +
            "A verdict értéke:\n" +
            "- \"helyes\" ha a jelölt válasza lényegében helyes, tartalmazza a kulcspontokat\n" +
            "- \"helytelen\" ha a válasz hiányos, pontatlan vagy jelentős javításra szorul";

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

    private static string NormalizeVerdict(string raw) => raw.ToLowerInvariant().Trim() switch
    {
        "helyes" or "correct" or "igen" or "jó" or "könnyű" or "good" or "easy" => "correct",
        _ => "incorrect"
    };
}
