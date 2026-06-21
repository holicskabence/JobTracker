namespace JobTracker.Application.DTOs;

public record PracticeQuestionResponse(
    int Id,
    string Category,
    string Question,
    string Hint,
    string SampleAnswer,
    string? Feedback
);

public record CreatePracticeQuestionRequest(
    string Category,
    string Question,
    string Hint,
    string SampleAnswer
);

public record UpdatePracticeQuestionRequest(
    string Category,
    string Question,
    string Hint,
    string SampleAnswer
);

public record RatePracticeQuestionRequest(string? Feedback);

public record BulkCreatePracticeQuestionsRequest(IReadOnlyList<CreatePracticeQuestionRequest> Questions);
