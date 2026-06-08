using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public class BaseRepository<T>(JobTrackerDbContext ctx) : IRepository<T> where T : class
{
    protected readonly JobTrackerDbContext Ctx = ctx;

    public async Task<IReadOnlyList<T>> GetAllAsync() =>
        await Ctx.Set<T>().ToListAsync();

    public async Task<T?> GetByIdAsync(int id) =>
        await Ctx.Set<T>().FindAsync(id);

    public async Task<T> AddAsync(T entity)
    {
        await Ctx.Set<T>().AddAsync(entity);
        await Ctx.SaveChangesAsync();
        return entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        Ctx.Set<T>().Update(entity);
        await Ctx.SaveChangesAsync();
        return entity;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var entity = await Ctx.Set<T>().FindAsync(id);
        if (entity is null) return false;
        Ctx.Set<T>().Remove(entity);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
