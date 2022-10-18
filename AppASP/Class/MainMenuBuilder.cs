using AppASP.Data;
using AppASP.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AppASP.Class
{
    public static class MainMenuBuilder
    {
        public const string About = "О программе";
        public const string Models = "Модели";
        public const string Devices = "Приборы";
        //

        public static Dictionary<string, MenuObject> _MainMenu = new Dictionary<string, MenuObject>
            {
                 { Models, new MenuObject{IsActive = false, ControllerName = "Models", IsVisible=true, IsTarget = true } },
                 { Devices, new MenuObject{IsActive = false, ControllerName = "Devices", IsVisible=true, IsTarget = true }},
                 { About, new MenuObject{IsActive = true, ControllerName = "Index", IsVisible=true, IsTarget = false } },
                 {"Вход", new MenuObject{IsActive = false, ControllerName = "Login", IsVisible=true, IsTarget = false }},
                 {"Регистрация",  new MenuObject{IsActive = false, ControllerName = "Register", IsVisible=true, IsTarget = false } }
            };

        
        // тут будет проверка прав текущего пользователя на видимость меню
        public static Dictionary<string, MenuObject> CheckAccess(string _current, string? username = null, ApplicationContext? ap = null)
        {
            #region "Формирование главного меню"
            //Надо проверить доступность меню
            List<AccessObject>? accessObjects = null;
            if (username != null)
                accessObjects = ap?.GetAccessMenuItems(username);
            
            //Настройка видимости
            foreach (var item in _MainMenu)
            {
                item.Value.IsActive = false;

                if (!item.Value.IsTarget)
                {
                    item.Value.IsVisible = true;
                    continue;
                }

                item.Value.IsVisible = (accessObjects != null && accessObjects.FirstOrDefault(p => p.Code?.ToUpper() == item.Value.ControllerName?.ToUpper()) != null);
            }
            //О программе по умолчанию активно
            _MainMenu[About].IsActive = true;

            //Активность
            _MainMenu[_current].IsActive = _MainMenu[_current].IsVisible;

            if (_current != About && _MainMenu[_current].IsActive)
               _MainMenu[About].IsActive = false;
            
            return _MainMenu;
          
            #endregion
        }

    }
}
