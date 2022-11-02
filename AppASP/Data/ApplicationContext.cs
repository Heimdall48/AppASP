using AppASP.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using System.Linq;
using System.Xml.Linq;
using System.Drawing.Printing;
using AppASP.ViewModels;

namespace AppASP.Data
{
    public class ApplicationContext : DbContext
    {
        public DbSet<Model> Models { get; set; } = null!;
        public DbSet<Revision> Revisions { get; set; } = null!;
        public DbSet<Device> Devices { get; set; } = null!;
        public DbSet<AccessObject> AccessObjects { get; set; } = null!;
        public ApplicationContext(DbContextOptions<ApplicationContext> options)
            : base(options)
        {

        }

        public IEnumerable<DeviceExt> GetOrderDevices(int pModel_ID)
        {
            var items = (from d in Devices
                         join r in Revisions on d.Revision_ID equals r.RevisionId
                         orderby d.SerialNumber
                         where r.Model_Id == pModel_ID
                         select new DeviceExt ( d.DeviceId, d.SerialNumber, r.Name, r.RevisionId )
                         );

            return (IEnumerable<DeviceExt>)items ;
        }

        public IEnumerable<Revision> GetOrderRevisions(int pModel_ID)
        {
          return Revisions.Where(o=>o.Model_Id==pModel_ID).OrderBy(p => p.Name); 
        }

        public int GetModelPageNumber(int pModel_ID)
        {
            int pageSize = 3;
            // Вычисляем на какой странице находится id
            Model? vModel = (from m in Models
                             where m.ModelId == pModel_ID
                             select m).FirstOrDefault();
            int i = 0;
            int page = 1;
            if (vModel != null)
                i = OrderModels.ToList().IndexOf(vModel) + 1;
            if (i > 0)
                page = (int)Math.Ceiling((decimal)i / pageSize);
            return page;
        }

        public int GetDevicePageNumber(int pModel_ID, int pDevice_ID)
        {
            int pageSize = 8;
            // Вычисляем на какой странице находится id
            Device? vDevice = (from d in Devices
                             where d.DeviceId == pDevice_ID
                             select d).FirstOrDefault();
            int i = 0;
            int page = 1;
            if (vDevice != null)
                i = (from d in Devices
                     join r in Revisions on d.Revision_ID equals r.RevisionId
                     orderby d.SerialNumber
                     where r.Model_Id == pModel_ID
                     select d).ToList().IndexOf(vDevice) + 1;

            if (i > 0)
                page = (int)Math.Ceiling((decimal)i / pageSize);

            return page;
        }

        public IEnumerable<Model> OrderModels
        {
            get { return Models.OrderBy(p=>p.Name); }
        }

        public List<AccessObject> GetAccessMenuItems(string username)
        {
            Microsoft.Data.SqlClient.SqlParameter param = new Microsoft.Data.SqlClient.SqlParameter("@UserName", username);
            return this.AccessObjects.FromSqlRaw("GetAccessMenuItems @UserName", param).ToList<AccessObject>();
        }

        public object GetModelImage(int pModel_ID)
        {
            Microsoft.Data.SqlClient.SqlParameter vModel_ID = new Microsoft.Data.SqlClient.SqlParameter("@Model_ID", pModel_ID);
            SqlParameter vPhoto = new SqlParameter("@Photo", System.Data.SqlDbType.NVarChar, 3000000, System.Data.ParameterDirection.Output, true, 0, 0, string.Empty, System.Data.DataRowVersion.Default, DBNull.Value);
            this.Database.ExecuteSqlRaw("SELECT TOP 1 @Photo = M.Photo FROM dbo.Model M WHERE M.Model_ID = @Model_ID", vPhoto, vModel_ID);
            return vPhoto.Value;
        }

        public void DeleteModel(int pModel_ID)
        {
            this.Database.ExecuteSqlRaw(String.Format("DELETE R FROM dbo.Revision R WHERE R.Model_ID = {0}", pModel_ID));
            this.Database.ExecuteSqlRaw(String.Format("DELETE M FROM dbo.Model M WHERE M.Model_ID = {0}", pModel_ID));
        }

        public void DeleteRevision(int pRevision_ID)
        {
            this.Database.ExecuteSqlRaw(String.Format("DELETE R FROM dbo.Revision R WHERE R.Revision_ID = {0}", pRevision_ID));
        }

        public void DeleteDevice(int pDevice_ID)
        {
            this.Database.ExecuteSqlRaw(String.Format("DELETE R FROM dbo.Device R WHERE R.Device_ID = {0}", pDevice_ID));
        }

        public void SaveModel(string name, int current_ID, string description, string? image, AppASP.Models.ItemModify itemmodify)
        {
            var vName = new SqlParameter("@Name", name);
            var vDescription = new SqlParameter("@Description", string.IsNullOrWhiteSpace(description) ? DBNull.Value : description);
            var vPhoto = new SqlParameter("@Photo", string.IsNullOrWhiteSpace(image) ? DBNull.Value : image);

            if (current_ID == 0)
            {
                SqlParameter vParameter = new SqlParameter("@Model_ID", System.Data.SqlDbType.Int, 8, System.Data.ParameterDirection.Output, true, 0, 0, string.Empty, System.Data.DataRowVersion.Default, DBNull.Value);
                this.Database.ExecuteSqlRaw(@"INSERT INTO [dbo].[Model] ([Name],[Photo] ,[Description]) 
                                              VALUES (@Name,@Photo, @Description)
                                              SELECT @Model_ID = SCOPE_IDENTITY()", vName, vPhoto, vDescription, vParameter);
                itemmodify.ID = Convert.ToInt32(vParameter.Value);
            }
            else
            {
                var vModel_ID = new SqlParameter("@Model_ID", current_ID);

                itemmodify.ID = current_ID;
                this.Database.ExecuteSqlRaw(@"UPDATE [dbo].[Model]
                                              SET [Name] = @Name, [Photo] = @Photo, [Description] = @Description
                                              WHERE Model_ID = @Model_ID", vName, vPhoto, vDescription, vModel_ID);
            }
        }

        public void SaveRevision(string name, int current_ID, int model_ID, AppASP.Models.ItemModify itemmodify)
        {
            var vName = new SqlParameter("@Name", name);
            
            if (current_ID == 0)
            {
                var vModelID = new SqlParameter("@Model_ID", model_ID);
                SqlParameter vParameter = new SqlParameter("@Revision_ID", System.Data.SqlDbType.Int, 8, System.Data.ParameterDirection.Output, true, 0, 0, string.Empty, System.Data.DataRowVersion.Default, DBNull.Value);
                this.Database.ExecuteSqlRaw(@"INSERT INTO [dbo].[Revision] ([Name],Model_ID) 
                                              VALUES (@Name,@Model_ID)
                                              SELECT @Revision_ID = SCOPE_IDENTITY()", vName, vModelID, vParameter);
                itemmodify.ID = Convert.ToInt32(vParameter.Value);
            }
            else
            {
                var vRevision_ID = new SqlParameter("@Revision_ID", current_ID);

                itemmodify.ID = current_ID;
                this.Database.ExecuteSqlRaw(@"UPDATE [dbo].[Revision]
                                              SET [Name] = @Name
                                              WHERE Revision_ID = @Revision_ID", vName, vRevision_ID);
            }
        }

        public void SaveDevice(string sn, int current_ID, int revision_ID, AppASP.Models.ItemModify itemmodify)
        {
            var vSerialNumber = new SqlParameter("@SerialNumber", sn);
            var vRevision_ID = new SqlParameter("@Revision_ID", revision_ID);

            if (current_ID == 0)
            {
                
                SqlParameter vParameter = new SqlParameter("@Device_ID", System.Data.SqlDbType.Int, 8, System.Data.ParameterDirection.Output, true, 0, 0, string.Empty, System.Data.DataRowVersion.Default, DBNull.Value);
                this.Database.ExecuteSqlRaw(@"INSERT INTO [dbo].[Device] ([SerialNumber],Revision_ID) 
                                              VALUES (@SerialNumber,@Revision_ID)
                                              SELECT @Device_ID = SCOPE_IDENTITY()", vSerialNumber, vRevision_ID, vParameter);
                itemmodify.ID = Convert.ToInt32(vParameter.Value);
            }
            else
            {
                var vDevice_ID = new SqlParameter("@Device_ID", current_ID);

                itemmodify.ID = current_ID;
                this.Database.ExecuteSqlRaw(@"UPDATE [dbo].[Device]
                                              SET [SerialNumber] = @SerialNumber, [Revision_ID] = @Revision_ID
                                              WHERE Device_ID = @Device_ID", vSerialNumber, vRevision_ID, vDevice_ID);
            }
        }

    }
  
}
