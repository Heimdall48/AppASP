using System.ComponentModel.DataAnnotations.Schema;

namespace AppASP.Models
{
    [Table("Revision")]
    public class Revision
    {
        [Column("Revision_ID")]
        public int RevisionId { get; set; }
        public string? Name { get; set; } 
        public int Model_Id { get; set; }
    }
}
