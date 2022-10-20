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

        public ActionResult GetViewRevisions(int pModel_ID)
        {
            var vRevisions = (from k in db.Revisions
                              where k.Model_Id == pModel_ID
                              select k);
            return PartialView("BuildRevisions", vRevisions);
        }

        public IActionResult Index()
         {
            return View(MainMenuBuilder.CheckAccess(MainMenuBuilder.About, User.Identity?.Name, db));
        }

        public IActionResult Models()
        {
            ModelView v = new ModelView(db.Models.ToList(), MainMenuBuilder.CheckAccess("Модели", User.Identity?.Name, db));
            return View(v);
        }
     
        public IActionResult Devices()
        {
            return View(MainMenuBuilder.CheckAccess("Приборы", User.Identity?.Name, db));
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

        public ActionResult DeleteModel(int pModel_ID)
        {
           db.DeleteModel(pModel_ID);
           return GetViewModels();
        }

        public ActionResult GetViewModels()
        {
            return PartialView("BuildModels", db.Models.ToList());
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

    }
}