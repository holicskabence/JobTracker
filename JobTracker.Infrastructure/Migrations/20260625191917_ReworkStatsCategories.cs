using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReworkStatsCategories : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsInterview",
                table: "EventTypes");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "JobStatusConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsInterview",
                table: "JobStatusConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(@"
                UPDATE JobStatusConfigs SET IsActive = 1 WHERE StatsCategory = 'Active';
                UPDATE JobStatusConfigs SET IsInterview = 1 WHERE [Key] = 'Visszahivas';
                UPDATE JobStatusConfigs SET StatsCategory = 'None' WHERE StatsCategory = 'Active';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "IsInterview",
                table: "JobStatusConfigs");

            migrationBuilder.AddColumn<bool>(
                name: "IsInterview",
                table: "EventTypes",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
