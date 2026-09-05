using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ReworkStatusStatsModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "JobStatusConfigs",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CountsAsApplication",
                table: "JobStatusConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "CountsAsResponse",
                table: "JobStatusConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTerminal",
                table: "JobStatusConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Outcome",
                table: "JobStatusConfigs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Open");

            migrationBuilder.AddColumn<int>(
                name: "StaleAfterDays",
                table: "JobStatusConfigs",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE [JobStatusConfigs]
                SET [Outcome] = CASE [StatsCategory] WHEN 'Success' THEN 'Success' WHEN 'Rejected' THEN 'Rejected' ELSE 'Open' END,
                    [IsTerminal] = CASE WHEN [StatsCategory] <> 'None' THEN 1 ELSE 0 END,
                    [CountsAsResponse] = CASE WHEN [IsInterview] = 1 OR [StatsCategory] <> 'None' THEN 1 ELSE 0 END,
                    [CountsAsApplication] = CASE WHEN [IsActive] = 1 OR [IsInterview] = 1 OR [StatsCategory] <> 'None' THEN 1 ELSE 0 END;
                """);

            migrationBuilder.Sql("""
                UPDATE [JobStatusConfigs]
                SET [StaleAfterDays] = CASE WHEN [IsInterview] = 1 THEN 14 ELSE 21 END
                WHERE [CountsAsApplication] = 1 AND [IsTerminal] = 0;
                """);

            migrationBuilder.DropColumn(
                name: "StatsCategory",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "JobStatusConfigs");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "StatsCategory",
                table: "JobStatusConfigs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "JobStatusConfigs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE [JobStatusConfigs]
                SET [StatsCategory] = CASE [Outcome] WHEN 'Success' THEN 'Success' WHEN 'Rejected' THEN 'Rejected' ELSE 'None' END,
                    [IsActive] = CASE WHEN [CountsAsApplication] = 1 AND [IsTerminal] = 0 THEN 1 ELSE 0 END;
                """);

            migrationBuilder.DropColumn(
                name: "CountsAsApplication",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "CountsAsResponse",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "IsTerminal",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "Outcome",
                table: "JobStatusConfigs");

            migrationBuilder.DropColumn(
                name: "StaleAfterDays",
                table: "JobStatusConfigs");
        }
    }
}
