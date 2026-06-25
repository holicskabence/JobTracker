using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStatsCategoryAndIsInterview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StatsCategory",
                table: "JobStatusConfigs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<bool>(
                name: "IsInterview",
                table: "EventTypes",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(@"
                UPDATE JobStatusConfigs SET StatsCategory = 'Active' WHERE [Key] IN ('Beadva', 'Visszahivas');
                UPDATE JobStatusConfigs SET StatsCategory = 'Success' WHERE [Key] = 'Ajanlat';
                UPDATE JobStatusConfigs SET StatsCategory = 'Rejected' WHERE [Key] = 'Elutasitva';
            ");

            migrationBuilder.Sql(@"
                UPDATE EventTypes SET IsInterview = 1 WHERE Name LIKE N'%interj%';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "StatsCategory",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "IsInterview",
                table: "EventTypes");
        }
    }
}
