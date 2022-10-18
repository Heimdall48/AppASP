using AppASP.Models;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using AppASP.Data;
using AppASP.ViewModels;
using AppASP.Class;
using System.Xml.Linq;

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

        public IActionResult GetModelImage(int pModel_ID)
        {
            object imageData = db.GetModelImage(pModel_ID);
            string imageSrc = string.Empty;
            if (imageData != null && imageData != DBNull.Value)
            {
                string imageBase64 = Convert.ToBase64String((byte[])imageData);
                imageSrc = string.Format("data:image/gif;base64,{0}", imageBase64);
            }
            return PartialView("GetModelImage", imageSrc);
     
        }
    }
}