namespace JobTracker.Application.DTOs;

public record PracticeCategoryResponse(int Id, string Name, string Color, int SortOrder, bool IsHidden);

public record CreatePracticeCategoryRequest(string Name, string Color);

public record UpdatePracticeCategoryRequest(string Name, string Color, bool IsHidden);

public record ReorderPracticeCategoryItem(int Id, int SortOrder);
