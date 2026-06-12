namespace JobTracker.Application.DTOs;

public record PracticeAttemptResponse(
    int Id,
    int PracticeQuestionId,
    string Category,
    string Question,
    string UserAnswer,
    string Feedback,
    DateTime CreatedAt
);

public record CreatePracticeAttemptRequest(
    int PracticeQuestionId,
    string UserAnswer,
    string Feedback
);
