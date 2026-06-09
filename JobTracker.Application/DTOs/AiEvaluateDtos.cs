namespace JobTracker.Application.DTOs;

public record AiEvaluateRequest(string UserAnswer, string? CustomPrompt);

public record AiEvaluateResponse(string Feedback, string Verdict);
