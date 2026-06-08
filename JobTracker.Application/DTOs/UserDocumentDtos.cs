namespace JobTracker.Application.DTOs;

public record UserDocumentResponse(
    int Id,
    string Name,
    string Type,
    string Updated,
    string Version
);

public record CreateUserDocumentRequest(
    string Name,
    string Type,
    string Version
);
