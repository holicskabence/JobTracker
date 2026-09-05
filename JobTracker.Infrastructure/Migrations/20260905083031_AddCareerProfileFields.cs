using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace JobTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCareerProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GitHubUrl",
                table: "Users",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LinkedInUrl",
                table: "Users",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Users",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MainSkills",
                table: "Users",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NoticePeriodDays",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PortfolioUrl",
                table: "Users",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredLocations",
                table: "Users",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredWorkMode",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SalaryExpectation",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetPosition",
                table: "Users",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "YearsOfExperience",
                table: "Users",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GitHubUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LinkedInUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "MainSkills",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "NoticePeriodDays",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PortfolioUrl",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreferredLocations",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "PreferredWorkMode",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SalaryExpectation",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "TargetPosition",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "YearsOfExperience",
                table: "Users");
        }
    }
}
