using AppASP.Models;

namespace AppASP.ViewModels
{
    public class ModelView
    {
        public IEnumerable<Model> models 
        { 
            get 
            {
                return PageViewExtension.items;
            } 
        }
        public PageViewExtension<Model> PageViewExtension { get; set; }
        public Dictionary<string, MenuObject> menuValuePairs;
        public ModelView(Dictionary<string, MenuObject> _menuValuePairs, PageViewExtension<Model> _pageViewModel)
        {
            menuValuePairs = _menuValuePairs;
            PageViewExtension = _pageViewModel;
        }
    
    }
}
