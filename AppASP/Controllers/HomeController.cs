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

        /*public static bool IsBase64String(string base64)
        {
            Span<byte> buffer = new Span<byte>(new byte[base64.Length]);
            return Convert.TryFromBase64String(base64, buffer, out int bytesParsed);
        }*/

        public ActionResult SaveModel(string name, int current_ID, string description,string image)
        {
            name = HttpUtility.UrlDecode(name);
            description = HttpUtility.UrlDecode(description);

            /*byte[]? vPhoto = null;
            //Приводим image к нужной кодировке
            int i = image.IndexOf(",");
            if (i > 0)
                image = image.Substring(i + 1, image.Length - i - 1).Trim();

            if (!string.IsNullOrEmpty(image) && IsBase64String(image))
                vPhoto = Convert.FromBase64String(image);
            else
                image = String.Empty;*/

            AppASP.Models.ItemModify vModelModify = new Models.ItemModify();

            var vModel = (from ss in db.Models where ss.Name == name && ss.ModelId != current_ID select ss).FirstOrDefault();
            if (vModel == null)
            {
                vModelModify.IsExists = false;
                db.SaveModel(name, current_ID, description, image, vModelModify);
            }
            return PartialView(vModelModify);
        }
    }
}