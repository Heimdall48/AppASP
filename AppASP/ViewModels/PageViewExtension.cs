namespace AppASP.ViewModels
{
    public class PageViewExtension<T>
    {
        public PageViewModel pageViewModel { get; set; }
        public List<T> items { get; set; }
        public PageViewExtension(PageViewModel pageViewModel, List<T> items)
        {
            this.pageViewModel = pageViewModel;
            this.items = items;
        }
    }
}
