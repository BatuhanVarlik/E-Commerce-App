using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ETicaret.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddViewHistoryAndRecommendations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariant_Products_ProductId",
                table: "ProductVariant");

            migrationBuilder.DropForeignKey(
                name: "FK_VariantOption_Products_ProductId",
                table: "VariantOption");

            migrationBuilder.DropForeignKey(
                name: "FK_VariantValue_VariantOption_VariantOptionId",
                table: "VariantValue");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VariantValue",
                table: "VariantValue");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VariantOption",
                table: "VariantOption");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductVariant",
                table: "ProductVariant");

            migrationBuilder.RenameTable(
                name: "VariantValue",
                newName: "VariantValues");

            migrationBuilder.RenameTable(
                name: "VariantOption",
                newName: "VariantOptions");

            migrationBuilder.RenameTable(
                name: "ProductVariant",
                newName: "ProductVariants");

            migrationBuilder.RenameIndex(
                name: "IX_VariantValue_VariantOptionId",
                table: "VariantValues",
                newName: "IX_VariantValues_VariantOptionId");

            migrationBuilder.RenameIndex(
                name: "IX_VariantOption_ProductId",
                table: "VariantOptions",
                newName: "IX_VariantOptions_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductVariant_ProductId",
                table: "ProductVariants",
                newName: "IX_ProductVariants_ProductId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VariantValues",
                table: "VariantValues",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VariantOptions",
                table: "VariantOptions",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductVariants",
                table: "ProductVariants",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "ViewHistories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: true),
                    SessionId = table.Column<string>(type: "text", nullable: true),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    ViewedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IpAddress = table.Column<string>(type: "text", nullable: true),
                    UserAgent = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ViewHistories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ViewHistories_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ViewHistories_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ViewHistories_ProductId",
                table: "ViewHistories",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ViewHistories_UserId",
                table: "ViewHistories",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariants_Products_ProductId",
                table: "ProductVariants",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VariantOptions_Products_ProductId",
                table: "VariantOptions",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VariantValues_VariantOptions_VariantOptionId",
                table: "VariantValues",
                column: "VariantOptionId",
                principalTable: "VariantOptions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductVariants_Products_ProductId",
                table: "ProductVariants");

            migrationBuilder.DropForeignKey(
                name: "FK_VariantOptions_Products_ProductId",
                table: "VariantOptions");

            migrationBuilder.DropForeignKey(
                name: "FK_VariantValues_VariantOptions_VariantOptionId",
                table: "VariantValues");

            migrationBuilder.DropTable(
                name: "ViewHistories");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VariantValues",
                table: "VariantValues");

            migrationBuilder.DropPrimaryKey(
                name: "PK_VariantOptions",
                table: "VariantOptions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProductVariants",
                table: "ProductVariants");

            migrationBuilder.RenameTable(
                name: "VariantValues",
                newName: "VariantValue");

            migrationBuilder.RenameTable(
                name: "VariantOptions",
                newName: "VariantOption");

            migrationBuilder.RenameTable(
                name: "ProductVariants",
                newName: "ProductVariant");

            migrationBuilder.RenameIndex(
                name: "IX_VariantValues_VariantOptionId",
                table: "VariantValue",
                newName: "IX_VariantValue_VariantOptionId");

            migrationBuilder.RenameIndex(
                name: "IX_VariantOptions_ProductId",
                table: "VariantOption",
                newName: "IX_VariantOption_ProductId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductVariants_ProductId",
                table: "ProductVariant",
                newName: "IX_ProductVariant_ProductId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VariantValue",
                table: "VariantValue",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_VariantOption",
                table: "VariantOption",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProductVariant",
                table: "ProductVariant",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductVariant_Products_ProductId",
                table: "ProductVariant",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VariantOption_Products_ProductId",
                table: "VariantOption",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_VariantValue_VariantOption_VariantOptionId",
                table: "VariantValue",
                column: "VariantOptionId",
                principalTable: "VariantOption",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
