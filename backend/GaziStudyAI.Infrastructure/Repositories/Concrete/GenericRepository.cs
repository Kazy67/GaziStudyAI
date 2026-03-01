using GaziStudyAI.Common.Entities;
using GaziStudyAI.Infrastructure.Context;
using GaziStudyAI.Infrastructure.Repositories.Abstract;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace GaziStudyAI.Infrastructure.Repositories.Concrete
{
    public class GenericRepository<TEntity> : IGenericRepository<TEntity> where TEntity : BaseEntity
    {
        protected readonly GaziStudyAIDbContext _context;
        protected readonly DbSet<TEntity> _dbSet;

        public GenericRepository(GaziStudyAIDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<TEntity>();
        }

        public async Task AddAsync(TEntity entity)
        {
            await _context.Set<TEntity>().AddAsync(entity);
        }

        public async Task AddRangeAsync(IEnumerable<TEntity> entities)
        {
            await _context.Set<TEntity>().AddRangeAsync(entities);
        }

        public async Task HardDeleteAsync(TEntity entity)
        {
            await Task.Run(() => { _context.Set<TEntity>().Remove(entity); });
        }

        public async Task<bool> AnyAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _context.Set<TEntity>().AnyAsync(predicate);
        }

        public async Task<int> CountAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _context.Set<TEntity>().CountAsync(predicate);
        }

        public async Task DeleteAsync(TEntity entity)
        {
            await Task.Run(() =>
            {
                // Soft delete: DbContext automatically sets IsActive=false, DeletedDate, and DeletedBy
                _context.Set<TEntity>().Remove(entity);
            });
        }

        public async Task<IList<TEntity>> Find(Expression<Func<TEntity, bool>> predicate)
        {
            return await _context.Set<TEntity>().Where(p => p.IsActive == true).Where(predicate).ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>>? predicate = null, int? take = null, int? skip = null, Func<IQueryable<TEntity>, IOrderedQueryable<TEntity>>? orderBy = null, params Expression<Func<TEntity, object>>[] includeProperties)
        {
            IQueryable<TEntity> query = _context.Set<TEntity>()
                .AsNoTracking() // ⚡ PERFORMANCE: Disable change tracking for read-only operations
                .Where(p => p.IsActive == true);

            if (predicate != null)
            {
                query = query.Where(predicate);

            }

            if (orderBy != null)
            {
                query = orderBy(query);
            }
            else
            {
                query = query.OrderByDescending(e => e.CreatedDate);
            }

            if (includeProperties.Any())
            {
                foreach (var item in includeProperties)
                {
                    query = query.Include(item);
                }
            }

            if (skip != null && skip.HasValue)
            {
                query = query.Skip(skip.Value);
            }


            if (take != null && take.HasValue)
            {
                query = query.Take(take.Value);
            }


            return await query.ToListAsync();
        }


        public async Task<TEntity?> GetAsync(Expression<Func<TEntity, bool>> predicate, params Expression<Func<TEntity, object>>[] includeProperties)
        {
            IQueryable<TEntity> query = _context.Set<TEntity>()
                .AsNoTracking(); // ⚡ PERFORMANCE: Disable change tracking for read-only operations

            if (predicate != null)
            {
                query = query.Where(predicate);
            }

            if (includeProperties.Any())
            {
                foreach (var item in includeProperties)
                {
                    query = query.Include(item);
                }
            }

            return await query.FirstOrDefaultAsync(p => p.IsActive == true);
        }

        public async Task<TEntity?> GetAsync(Expression<Func<TEntity, bool>> predicate, Func<IQueryable<TEntity>, IQueryable<TEntity>>? includeProperties = null)
        {
            IQueryable<TEntity> query = _context.Set<TEntity>()
                .AsNoTracking(); // ⚡ PERFORMANCE: Disable change tracking for read-only operations

            if (predicate != null)
            {
                query = query.Where(predicate);
            }

            if (includeProperties != null)
            {
                query = includeProperties(query);
            }

            return await query.FirstOrDefaultAsync(p => p.IsActive == true);
        }

        public async Task<TEntity?> GetByIdAsync(Guid id)
        {
            return await _context.Set<TEntity>().FirstOrDefaultAsync(x => x.Id == id && x.IsActive);
        }

        public async Task UpdateAsync(TEntity entity)
        {
            var existingEntity = _context.Set<TEntity>().Local.FirstOrDefault(e => e.Id == entity.Id);
            if (existingEntity != null)
            {
                _context.Entry(existingEntity).CurrentValues.SetValues(entity);
            }
            else
            {
                var trackedEntity = _context.Entry(entity);
                if (trackedEntity.State == EntityState.Detached)
                {
                    _context.Set<TEntity>().Update(entity);
                }
                else
                {
                    trackedEntity.CurrentValues.SetValues(entity);
                }
            }
            await Task.CompletedTask;
        }

        public void Update(TEntity entity)
        {
            _context.Set<TEntity>().Update(entity);
        }

        public void Remove(TEntity entity)
        {
            _context.Set<TEntity>().Remove(entity);
        }

        public void RemoveRange(IEnumerable<TEntity> entities)
        {
            _context.Set<TEntity>().RemoveRange(entities);
        }

        public IQueryable<TEntity> GetQueryable()
        {
            return _context.Set<TEntity>().AsQueryable();
        }
    }
}
