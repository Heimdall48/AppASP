using AppASP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace AppASP.Data
{
    public class IdentityContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        public IdentityContext(DbContextOptions<IdentityContext> options)
            : base(options)
        {
            Database.EnsureCreated();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<User>(b =>
            {
                b.ToTable("User");
                b.Property(e => e.Id).HasColumnName("User_ID");
            });

            /*modelBuilder.Entity<IdentityUserClaim<string>>(b =>
            {
                b.ToTable("MyUserClaims");
            });

            modelBuilder.Entity<IdentityUserLogin<string>>(b =>
            {
                b.ToTable("MyUserLogins");
            });

            modelBuilder.Entity<IdentityUserToken<string>>(b =>
            {
                b.ToTable("MyUserTokens");
            });

            modelBuilder.Entity<IdentityRole>(b =>
            {
                b.ToTable("MyRoles");
            });

            modelBuilder.Entity<IdentityRoleClaim<string>>(b =>
            {
                b.ToTable("MyRoleClaims");
            });

            modelBuilder.Entity<IdentityUserRole<string>>(b =>
            {
                b.ToTable("MyUserRoles");
            });*/
        }
    }
}
