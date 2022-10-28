using System.ComponentModel.DataAnnotations.Schema;

namespace AppASP.Models
{
    [Table("Device")]
    public class Device
    {
        [Column("Device_ID")]
        public int DeviceId { get; set; }
        public string? SerialNumber { get; set; }
        public int Revision_ID { get; set; }
    }
}
