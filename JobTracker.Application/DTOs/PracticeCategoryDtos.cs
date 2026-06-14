namespace JobTracker.Application.DTOs;

public record PracticeCategoryResponse(int Id, string Name, string Color);

public record CreatePracticeCategoryRequest(string Name, string Color);

public record UpdatePracticeCategoryRequest(string Name, string Color);
