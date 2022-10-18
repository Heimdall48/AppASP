using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;

namespace AppASP.ViewModels
{
    public class LoginViewModel
    {
        [Required(ErrorMessage = "Введите логин")]
        [Display(Name = "Логин")]
        public string? UserName { get; set; }

        [Required(ErrorMessage = "Введите пароль")]
        [DataType(DataType.Password)]
        [Display(Name = "Пароль")]
        public string? Password { get; set; }

        [Display(Name = "Запомнить?")]
        public bool RememberMe { get; set; }
    }
}
