using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ETicaret.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UploadController : ControllerBase
{
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<UploadController> _logger;

    public UploadController(IWebHostEnvironment environment, ILogger<UploadController> logger)
    {
        _environment = environment;
        _logger = logger;
    }

    [HttpPost("review-image")]
    public async Task<IActionResult> UploadReviewImage(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Dosya seçilmedi" });
            }

            // Dosya tipi kontrolü
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Sadece resim dosyaları yüklenebilir (jpg, jpeg, png, gif, webp)" });
            }

            // Dosya boyutu kontrolü (5MB max)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "Dosya boyutu maksimum 5MB olabilir" });
            }

            // Uploads klasörünü oluştur
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "reviews");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Benzersiz dosya adı oluştur
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Dosyayı kaydet
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // URL döndür
            var fileUrl = $"/uploads/reviews/{uniqueFileName}";
            
            return Ok(new { url = fileUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Resim yükleme hatası");
            return StatusCode(500, new { message = "Resim yüklenirken bir hata oluştu" });
        }
    }

    [HttpPost("product-image")]
    public async Task<IActionResult> UploadProductImage(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "Dosya seçilmedi" });
            }

            // Dosya tipi kontrolü
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest(new { message = "Sadece resim dosyaları yüklenebilir (jpg, jpeg, png, gif, webp)" });
            }

            // Dosya boyutu kontrolü (5MB max)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest(new { message = "Dosya boyutu maksimum 5MB olabilir" });
            }

            // Uploads klasörünü oluştur
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", "products");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Benzersiz dosya adı oluştur
            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Dosyayı kaydet
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // URL döndür
            var fileUrl = $"/uploads/products/{uniqueFileName}";
            
            return Ok(new { url = fileUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Resim yükleme hatası");
            return StatusCode(500, new { message = "Resim yüklenirken bir hata oluştu" });
        }
    }

    [HttpDelete("review-image")]
    public IActionResult DeleteReviewImage([FromQuery] string imageUrl)
    {
        try
        {
            if (string.IsNullOrEmpty(imageUrl))
            {
                return BadRequest(new { message = "Resim URL'i gerekli" });
            }

            // URL'den dosya yolunu çıkar
            var fileName = Path.GetFileName(imageUrl);
            var filePath = Path.Combine(_environment.WebRootPath, "uploads", "reviews", fileName);

            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
                return Ok(new { message = "Resim silindi" });
            }

            return NotFound(new { message = "Resim bulunamadı" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Resim silme hatası");
            return StatusCode(500, new { message = "Resim silinirken bir hata oluştu" });
        }
    }
}
