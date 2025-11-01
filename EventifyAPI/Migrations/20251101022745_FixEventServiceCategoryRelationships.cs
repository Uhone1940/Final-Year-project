using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventifyAPI.Migrations
{
    /// <inheritdoc />
    public partial class FixEventServiceCategoryRelationships : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventServiceCategory_Events_EventId1",
                table: "EventServiceCategory");

            migrationBuilder.DropIndex(
                name: "IX_EventServiceCategory_EventId1",
                table: "EventServiceCategory");

            migrationBuilder.DropColumn(
                name: "EventId1",
                table: "EventServiceCategory");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EventId1",
                table: "EventServiceCategory",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_EventServiceCategory_EventId1",
                table: "EventServiceCategory",
                column: "EventId1");

            migrationBuilder.AddForeignKey(
                name: "FK_EventServiceCategory_Events_EventId1",
                table: "EventServiceCategory",
                column: "EventId1",
                principalTable: "Events",
                principalColumn: "EventId");
        }
    }
}
