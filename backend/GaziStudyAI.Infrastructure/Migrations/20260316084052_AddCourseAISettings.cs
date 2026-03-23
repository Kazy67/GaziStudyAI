using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaziStudyAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseAISettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("1cca33b7-1bcf-44b0-9e73-aa1c390e1cbb"));

            migrationBuilder.AddColumn<bool>(
                name: "AllowCodeQuestions",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowMathQuestions",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "AllowTheoryQuestions",
                table: "Courses",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("827b4c26-47ac-4f66-a05b-df6b145e1ad6"), null, new DateTime(2026, 3, 16, 8, 40, 52, 231, DateTimeKind.Utc).AddTicks(8218), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("827b4c26-47ac-4f66-a05b-df6b145e1ad6"));

            migrationBuilder.DropColumn(
                name: "AllowCodeQuestions",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "AllowMathQuestions",
                table: "Courses");

            migrationBuilder.DropColumn(
                name: "AllowTheoryQuestions",
                table: "Courses");

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("1cca33b7-1bcf-44b0-9e73-aa1c390e1cbb"), null, new DateTime(2026, 3, 15, 8, 42, 11, 871, DateTimeKind.Utc).AddTicks(5167), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }
    }
}
