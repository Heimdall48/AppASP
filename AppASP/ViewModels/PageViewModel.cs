namespace AppASP.ViewModels
{
    public class PageViewModel
    {
        public int PageNumber { get; private set; }
        public int TotalPages { get; private set; }
        public string ControllerName {get; private set;}
        //public List<T>? Data { get; private set; }

        public PageViewModel(int count, int pageNumber, int pageSize, string controllerName/*, List<T> data*/)
        {
            PageNumber = pageNumber;
            TotalPages = (int)Math.Ceiling(count / (double)pageSize);
            ControllerName = controllerName;
            //Data = data;
        }

        public bool HasPreviousPage
        {
            get
            {
                return (PageNumber > 1);
            }
        }

        public bool HasNextPage
        {
            get
            {
                return (PageNumber < TotalPages);
            }
        }
    }
}
