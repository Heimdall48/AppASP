using System.ComponentModel.DataAnnotations.Schema;

namespace AppASP.Models
{
    [Table("Model")]
    public class Model
    {
        [Column("Model_ID")]
        public int ModelId { get; set; }
        public string? Name { get; set; } // имя модели
        public byte[]? Photo { get; set; }//Фотка модели
        public string? Description { get; set; }

    }
}
