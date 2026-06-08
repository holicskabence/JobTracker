using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;

namespace JobTracker.Infrastructure.Repositories;

public sealed class UserDocumentRepository(JobTrackerDbContext ctx)
    : BaseRepository<UserDocument>(ctx), IUserDocumentRepository;
