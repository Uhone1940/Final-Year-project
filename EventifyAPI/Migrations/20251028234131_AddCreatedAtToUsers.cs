using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventifyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddCreatedAtToUsers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "ServiceCategoryId",
                keyValue: 2,
                column: "Name",
                value: "Photography / Videography");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 29, 0, 0, 0, 0, DateTimeKind.Utc));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "ServiceCategories",
                keyColumn: "ServiceCategoryId",
                keyValue: 2,
                column: "Name",
                value: "Photography");
        }
    }
}
