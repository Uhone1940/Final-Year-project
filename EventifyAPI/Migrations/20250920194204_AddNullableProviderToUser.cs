using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventifyAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddNullableProviderToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventServiceProviders_UserId",
                table: "EventServiceProviders");

            migrationBuilder.AddColumn<bool>(
                name: "IsSuspended",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "UserId",
                keyValue: 1,
                column: "IsSuspended",
                value: false);

            migrationBuilder.CreateIndex(
                name: "IX_EventServiceProviders_UserId",
                table: "EventServiceProviders",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventServiceProviders_UserId",
                table: "EventServiceProviders");

            migrationBuilder.DropColumn(
                name: "IsSuspended",
                table: "Users");

            migrationBuilder.CreateIndex(
                name: "IX_EventServiceProviders_UserId",
                table: "EventServiceProviders",
                column: "UserId");
        }
    }
}
