using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToEventType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_EventTypes_Name",
                table: "EventTypes");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "EventTypes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
                UPDATE EventTypes SET UserId = (SELECT TOP 1 Id FROM Users ORDER BY Id) WHERE UserId = 0;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_EventTypes_UserId_Name",
                table: "EventTypes",
                columns: new[] { "UserId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_EventTypes_Users_UserId",
                table: "EventTypes",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_EventTypes_Users_UserId",
                table: "EventTypes");

            migrationBuilder.DropIndex(
                name: "IX_EventTypes_UserId_Name",
                table: "EventTypes");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "EventTypes");

            migrationBuilder.CreateIndex(
                name: "IX_EventTypes_Name",
                table: "EventTypes",
                column: "Name",
                unique: true);
        }
    }
}
