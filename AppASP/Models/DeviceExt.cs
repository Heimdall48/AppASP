using Microsoft.Build.Framework;
using System.ComponentModel.DataAnnotations.Schema;

namespace AppASP.Models
{
    public class DeviceExt
    {
        public int DeviceId { get; set; }

        [Required]
        public string? SerialNumber { get; set; }
        public string? Revision_Name { get; set; }
        [Required]
        public int Revision_ID { get; set; }
        public DeviceExt(int deviceId, string? sn, string? revisionname, int revision_ID)
        {
            DeviceId = deviceId;
            SerialNumber = sn;
            Revision_Name = revisionname;
            Revision_ID = revision_ID;
        }
    }
}
