using AppASP.Models;

namespace AppASP.ViewModels
{
    public class ModelView
    {
        public IEnumerable<Model> models;
        public Dictionary<string, MenuObject> menuValuePairs;
        public ModelView(IEnumerable<Model> _models, Dictionary<string, MenuObject> _menuValuePairs)
        {
            models = _models;
            menuValuePairs = _menuValuePairs;
        }

    }
}
