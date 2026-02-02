namespace ETicaret.Application.DTOs;

public class ShippingCalculationDto
{
    public decimal CartSubtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal FreeShippingThreshold { get; set; }
    public decimal RemainingForFreeShipping { get; set; }
    public bool QualifiesForFreeShipping { get; set; }
    public decimal Total { get; set; }
}
