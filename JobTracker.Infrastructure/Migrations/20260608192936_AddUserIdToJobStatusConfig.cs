using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToJobStatusConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_JobStatusConfigs_Key",
                table: "JobStatusConfigs");

            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "JobStatusConfigs",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // Assign the existing (formerly global) status configs to the first user...
            migrationBuilder.Sql(@"UPDATE JobStatusConfigs SET UserId = (SELECT TOP 1 Id FROM Users ORDER BY Id) WHERE UserId = 0;");

            // ...then give every other existing user their own private copy of the same defaults.
            migrationBuilder.Sql(@"
INSERT INTO JobStatusConfigs (UserId, [Key], Label, Color, SortOrder)
SELECT u.Id, c.[Key], c.Label, c.Color, c.SortOrder
FROM Users u
CROSS JOIN (
    SELECT [Key], Label, Color, SortOrder
    FROM JobStatusConfigs
    WHERE UserId = (SELECT TOP 1 Id FROM Users ORDER BY Id)
) c
WHERE u.Id <> (SELECT TOP 1 Id FROM Users ORDER BY Id);");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusConfigs_UserId_Key",
                table: "JobStatusConfigs",
                columns: new[] { "UserId", "Key" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_JobStatusConfigs_Users_UserId",
                table: "JobStatusConfigs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobStatusConfigs_Users_UserId",
                table: "JobStatusConfigs");

            migrationBuilder.DropIndex(
                name: "IX_JobStatusConfigs_UserId_Key",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "JobStatusConfigs");

            migrationBuilder.CreateIndex(
                name: "IX_JobStatusConfigs_Key",
                table: "JobStatusConfigs",
                column: "Key",
                unique: true);
        }
    }
}
