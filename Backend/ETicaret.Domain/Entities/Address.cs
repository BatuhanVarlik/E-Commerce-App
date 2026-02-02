using ETicaret.Domain.Common;

namespace ETicaret.Domain.Entities;

public class Address : BaseEntity
{
    public string UserId { get; set; } = string.Empty;
    public User User { get; set; } = null!;
    
    public string Title { get; set; } = string.Empty;  // "Ev", "İş", vb.
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    
    public string City { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string BuildingNo { get; set; } = string.Empty;
    public string ApartmentNo { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    
    public bool IsDefault { get; set; }
    public AddressType Type { get; set; }
}

public enum AddressType
{
    Billing,    // Fatura adresi
    Shipping,   // Teslimat adresi
    Both        // Her ikisi de
}
