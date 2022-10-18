using System.ComponentModel.DataAnnotations.Schema;

namespace AppASP.Models
{
    [Table("AccessObject")]
    public class AccessObject
    {
        [Column("AccessObject_ID")]
        public int AccessObjectId { get; set; }
        public string? Name { get; set; } // имя модели
        public string? Code { get; set; }

    }
}

