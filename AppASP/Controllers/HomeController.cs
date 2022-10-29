using AppASP.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using AppASP.Data;
using AppASP.ViewModels;
using AppASP.Class;
using System.Xml.Linq;
using Microsoft.Data.SqlClient;
using System.Web;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.CodeAnalysis.Options;
using Newtonsoft.Json.Linq;


namespace AppASP.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        ApplicationContext db;
        public HomeController(ApplicationContext context, ILogger<HomeController> logger)
        {
            _logger = logger;
            db = context;
        }

        public IActionResult Index()
        {
            return View(MainMenuBuilder.CheckAccess(MainMenuBuilder.About, User.Identity?.Name, db));
        }

        //int pageSize = 3;

        private PageViewExtension<T> GetPageViewExtension<T>(int page, List<T> list, string controllername)
        {
            int pageSize = PageViewExtension<T>.PageSize;
            //Если такой страницы нет то берём последнюю
            List<T> source = list; 
            var count = source.Count();

            var tp = (int)Math.Ceiling(count / (double)pageSize);
            if (page > tp)
                page = tp;

            var items = source.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            return new PageViewExtension<T>(new PageViewModel(count, page, pageSize, controllername), items);
        }

        public IActionResult Models(int page = 1)
        {
            PageViewExtension<Model> vObject = GetPageViewExtension(page, db.OrderModels.ToList(), "Models");
            ModelView v = new ModelView(MainMenuBuilder.CheckAccess("Модели", User.Identity?.Name, db), vObject);
                                            
            return View(v);
        }

        public ContentResult GetModelsPageNumber(int id)
        {
            return Content(db.GetModelPageNumber(id).ToString());
        }

        [HttpPost]
        //Метод вызываемый по щелчку на кнопке пагинации - временный аналог GetViewModels
        public ActionResult RefreshModels(int page = 1)
        {
            PageViewExtension<Model> vObject = GetPageViewExtension(page, db.OrderModels.ToList(), "Models");
            
            return PartialView("BuildModels", vObject.items);
        }

        public ActionResult GetViewRevisions(int pModel_ID)
        {
            return PartialView("BuildRevisions", db.GetOrderRevisions(pModel_ID));
        }

        public ActionResult GetRevisionsByModel(int pModel_ID)
        {
            IEnumerable<Revision> vItems = db.GetOrderRevisions(pModel_ID);
            string vResult = @"<select class='form-select' id='cbRevisions'>";
            foreach (var item in vItems)
            {
                vResult += $"<option value={item.RevisionId}>{item.Name}</option>";
            }
            vResult += "</select>";
            return Content(vResult);
        }

        public ActionResult GetViewDevices(int pModel_ID)
        {
            return PartialView("BuildDevices", db.GetOrderDevices(pModel_ID));
        }

        [HttpPost]
        public ActionResult ModelsPagination(int page)
        {
            PageViewExtension<Model> vObject = GetPageViewExtension(page, db.OrderModels.ToList(), "Models");
            return PartialView("Pagination", vObject.pageViewModel);
        }

        public IActionResult Devices()
        {
            PageViewExtension<Model> vObject = GetPageViewExtension(1, db.OrderModels.ToList(), "Models");
            vObject.items = db.OrderModels.ToList();
            ModelView v = new ModelView(MainMenuBuilder.CheckAccess("Приборы", User.Identity?.Name, db), vObject);

            return View(v);
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }

        public string? GetModelImage(int pModel_ID)
        {
            object imageData = db.GetModelImage(pModel_ID);
            string? imageSrc = string.Empty;
            if (imageData != null && imageData != DBNull.Value)
                imageSrc = imageData?.ToString();

            return imageSrc?.Trim();
        }

        private bool CheckOnDeleteModel(int pModel_ID)
        {
            //Проверка на связь с существующими приборами
            var vKey = (from k in db.Devices join r in db.Revisions on k.Revision_ID equals r.RevisionId
                        where r.Model_Id == pModel_ID
                        select k).FirstOrDefault();

            if (vKey != null)
                return false;

            return true;
        }

        public ActionResult CheckDeleteModel(int pModel_ID)
        {
           return PartialView(!CheckOnDeleteModel(pModel_ID));
        }

        public ActionResult CheckDeleteRevision(int pRevision_ID)
        {
            return PartialView(!CheckOnDeleteRevision(pRevision_ID));
        }

        private bool CheckOnDeleteRevision(int pRevision_ID)
        {
            //Проверка на связь с существующими приборами
            var vKey = (from k in db.Devices
                        where k.Revision_ID == pRevision_ID
                        select k).FirstOrDefault();

            if (vKey != null)
                return false;

            return true;
        }

        public ActionResult DeleteModel(int pModel_ID)
        {
            //Определяем страницу на которой данная запись
           var pagenumber = GetModelsPageNumber(pModel_ID);
           db.DeleteModel(pModel_ID);
           return pagenumber;
        }

        [HttpPost]
        public ActionResult DeleteRevision(int pRevision_ID, int pModel_ID)
        {
            db.DeleteRevision(pRevision_ID);
            return GetViewRevisions(pModel_ID);
        }

        public ActionResult SaveModel(string name, int current_ID, string description,string image)
        {
            name = HttpUtility.UrlDecode(name);
            description = HttpUtility.UrlDecode(description);

            AppASP.Models.ItemModify vModelModify = new Models.ItemModify();

            var vModel = (from ss in db.Models where ss.Name == name && ss.ModelId != current_ID select ss).FirstOrDefault();
            if (vModel == null)
            {
                vModelModify.IsExists = false;
                db.SaveModel(name, current_ID, description, image, vModelModify);
            }
            return PartialView(vModelModify);
        }

        public ActionResult SaveRevision(string name, int current_ID, int model_ID)
        {
            name = HttpUtility.UrlDecode(name);
        
            AppASP.Models.ItemModify vModelModify = new Models.ItemModify();

            var vRevision = (from ss in db.Revisions where ss.Name == name && ss.RevisionId != current_ID && ss.Model_Id == model_ID select ss).FirstOrDefault();
            if (vRevision == null)
            {
                vModelModify.IsExists = false;
                db.SaveRevision(name, current_ID, model_ID, vModelModify);
            }
            return PartialView(vModelModify);
        }

        public ActionResult SaveDevice(string sn, int current_ID, int model_ID, int revision_ID)
        {
            sn = HttpUtility.UrlDecode(sn);

            AppASP.Models.ItemModify vModelModify = new Models.ItemModify();

            var vDevice = (from d in db.Devices
                                        join r in db.Revisions
                                    on d.Revision_ID equals r.RevisionId
                             where d.DeviceId != current_ID && d.SerialNumber == sn && r.Model_Id == model_ID select d).FirstOrDefault();
            if (vDevice == null)
            {
                vModelModify.IsExists = false;
                db.SaveDevice(sn, current_ID, revision_ID, vModelModify);
            }
            return PartialView(vModelModify);
        }

        [HttpPost]
        public ActionResult DeleteDevice(int pDevice_ID, int pModel_ID)
        {
            db.DeleteDevice(pDevice_ID);
            return GetViewDevices(pModel_ID);
        }

    }
}