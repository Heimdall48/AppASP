namespace AppASP.Models
{
    public class ItemModify
    {
        public bool IsExists { get; set; }
        public int? ID { get; set; }
        public ItemModify()
        {
            IsExists = true;
            ID = null;
        }
    }
}
