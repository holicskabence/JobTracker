namespace JobTracker.Application.Interfaces;

public interface IAzureOpenAiService
{
    Task<(string Feedback, string Verdict)> EvaluateAnswerAsync(
        string question, string hint, string sampleAnswer,
        string userAnswer, string? customPrompt);
}
