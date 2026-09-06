using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddJobIdToCalendarEvent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "JobId",
                table: "CalendarEvents",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CalendarEvents_JobId",
                table: "CalendarEvents",
                column: "JobId");

            migrationBuilder.AddForeignKey(
                name: "FK_CalendarEvents_Jobs_JobId",
                table: "CalendarEvents",
                column: "JobId",
                principalTable: "Jobs",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CalendarEvents_Jobs_JobId",
                table: "CalendarEvents");

            migrationBuilder.DropIndex(
                name: "IX_CalendarEvents_JobId",
                table: "CalendarEvents");

            migrationBuilder.DropColumn(
                name: "JobId",
                table: "CalendarEvents");
        }
    }
}
