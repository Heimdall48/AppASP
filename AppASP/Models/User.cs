using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.AspNetCore.Identity;

namespace AppASP.Models
{
    public class User : IdentityUser<int>
    {
        public int Year { get; set; }
        public string? FullName { get; set; }
    }
}
