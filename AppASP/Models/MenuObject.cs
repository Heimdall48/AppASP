namespace AppASP.Models
{
    public class MenuObject
    {
        public bool IsVisible { get; set; }
        public bool IsActive { get; set; }
        public string? ControllerName { get; set; }
        public bool IsTarget { get; set; }
    }
}
