using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;

namespace AppASP.ViewModels
{
    public class RegisterViewModel
    {
        [Required(ErrorMessage = "Введите Email")]
        [Display(Name = "Email")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Введите логин")]
        [Display(Name = "Логин")]
        public string? UserName { get; set; }

        [Required(ErrorMessage = "Введите данные пользователя")]
        [Display(Name = "ФИО пользователя")]
        public string? FullName { get; set; }

        [Required(ErrorMessage = "Введите год рождения")]
        [Display(Name = "Год рождения")]
        [Range(1950, 2010, ErrorMessage = "Недопустимый год рождения")]
        public int Year { get; set; }

        [Required(ErrorMessage = "Введите пароль")]
        [DataType(DataType.Password)]
        [Display(Name = "Пароль")]
        public string? Password { get; set; }

        [Required(ErrorMessage = "Введите подтверждение пароля")]
        [Compare("Password", ErrorMessage = "Пароли не совпадают")]
        [DataType(DataType.Password)]
        [Display(Name = "Подтвердить пароль")]
        public string? PasswordConfirm { get; set; }
    }
}
