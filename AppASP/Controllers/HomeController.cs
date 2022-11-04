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
using Microsoft.AspNetCore.Http;
using System;


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
            //Проверка прав только если пользователь аавторизован
            return View(MainMenuBuilder.CheckAccess(MainMenuBuilder.About, GetAccessObject()));
        }

        //Записываем в сессию объект с правами
#nullable disable
        private List<AccessObject> GetAccessObject()
        {
            if (User.Identity?.Name == null)
                return null;

            if (HttpContext.Session.Keys.Contains("AccessObject"))
                return HttpContext.Session.Get<List<AccessObject>>("AccessObject");
            List<AccessObject> vList = db.GetAccessMenuItems(User.Identity.Name);
            HttpContext.Session.Set<List<AccessObject>>("AccessObject", vList);
            return vList;
        }

        void InitViewBag()
        {
            List<AccessObject> vList = GetAccessObject();
            
            ViewData["MODEL_UPDATE"] = false;
            ViewData["DEVICE_UPDATE"] = false;
            foreach (var item in vList)
            {
                if (item.Code == "MODEL_UPDATE" || item.Code == "DEVICE_UPDATE")
                    ViewData[item.Code] = true; 
            }
        }
#nullable restore

        private PageViewExtension<T> GetPageViewExtension<T>(int page, List<T> list, int pageSize = 3)
        {
            //Если такой страницы нет то берём последнюю
            List<T> source = list; 
            var count = source.Count();

            var tp = (int)Math.Ceiling(count / (double)pageSize);
            if (page > tp)
                page = tp;

            var items = source.Skip((page - 1) * pageSize).Take(pageSize).ToList();
            return new PageViewExtension<T>(new PageViewModel(count, page, pageSize), items);
        }

        public IActionResult Models(int page = 1)
        {
            PageViewExtension<Model> vObject = GetPageViewExtension(page, db.OrderModels.ToList(), 3);
            ModelView v = new ModelView(MainMenuBuilder.CheckAccess("Модели", GetAccessObject()), vObject);
            InitViewBag();
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
            PageViewExtension<Model> vObject = GetPageViewExtension(page, db.OrderModels.ToList());
            
            return PartialView("BuildModels", vObject.items);
        }
        [HttpPost]
        public ActionResult ModelsPagination(int page)
        {
            PageViewExtension<Model> vObject = GetPageViewExtension(page, db.OrderModels.ToList());
            return PartialView("Pagination", vObject.pageViewModel);
        }

        /********************************************Ревизии************************************************/
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

        [HttpPost]
        public ActionResult DeleteRevision(int pRevision_ID, int pModel_ID)
        {
            var pagenumber = GetRevisionPageNumber(pModel_ID, pRevision_ID);
            db.DeleteRevision(pRevision_ID);
            return pagenumber;
        }
        //-------------------------доработки по ревизиям------------------------------------
        public IActionResult RefreshRevisions(int pModel_ID, int page = 1)
        {
            PageViewExtension<Revision> vObject = GetPageViewExtension(page, db.GetOrderRevisions(pModel_ID).ToList(), 4);
            return PartialView("BuildRevisions", vObject.items);
        }

        [HttpPost]
        public ActionResult RevisionPagination(int pModel_ID, int page = 1)
        {
            PageViewExtension<Revision> vObject = GetPageViewExtension(page, db.GetOrderRevisions(pModel_ID).ToList(), 4);
            return PartialView("DevicesPagination", vObject.pageViewModel);
        }

        public ContentResult GetRevisionPageNumber(int pModel_ID, int pRevision_ID)
        {
            return Content(db.GetRevisionPageNumber(pModel_ID, pRevision_ID).ToString());
        }

        //****************************************** Приборы непосредственно********************************
        #region "Приборы"
        public IActionResult Devices()
        {
             PageViewExtension<Model> vObject = GetPageViewExtension(1, db.OrderModels.ToList());
            //Выводим весь список моделей в комбобокс
            vObject.items = db.OrderModels.ToList();
            ModelView v = new ModelView(MainMenuBuilder.CheckAccess("Приборы", GetAccessObject()), vObject);
            InitViewBag();
            return View(v);
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

        public IActionResult RefreshDevices(int pModel_ID, int page = 1)
        {
            PageViewExtension<DeviceExt> vObject = GetPageViewExtension(page, db.GetOrderDevices(pModel_ID).ToList(), 8);
            return PartialView("BuildDevices", vObject.items);
        }

        [HttpPost]
        public ActionResult DevicesPagination(int pModel_ID, int page = 1)
        {
            PageViewExtension<DeviceExt> vObject = GetPageViewExtension(page, db.GetOrderDevices(pModel_ID).ToList(), 8);
            return PartialView("DevicesPagination", vObject.pageViewModel);
        }

        //Возврат номера страницы, на ктором находится искомый прибор
        public ContentResult GetDevicePageNumber(int pModel_ID, int pDevice_ID)
        {
            return Content(db.GetDevicePageNumber(pModel_ID, pDevice_ID).ToString());
        }

        [HttpPost]
        public ActionResult DeleteDevice(int pDevice_ID, int pModel_ID)
        {
            var pagenumber = GetDevicePageNumber(pModel_ID, pDevice_ID);
            db.DeleteDevice(pDevice_ID);
            return pagenumber;
        }
        #endregion
        //******************************************************************************************************************

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

        public ActionResult DeleteModel(int pModel_ID)
        {
            //Определяем страницу на которой данная запись
           var pagenumber = GetModelsPageNumber(pModel_ID);
           db.DeleteModel(pModel_ID);
           return pagenumber;
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

    }
}