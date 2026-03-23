using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaziStudyAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddingPrefixToCourse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("3244a79f-792d-49db-9e98-bc02704d63f9"));

            migrationBuilder.AddColumn<string>(
                name: "Prefix",
                table: "Courses",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("1cca33b7-1bcf-44b0-9e73-aa1c390e1cbb"), null, new DateTime(2026, 3, 15, 8, 42, 11, 871, DateTimeKind.Utc).AddTicks(5167), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("1cca33b7-1bcf-44b0-9e73-aa1c390e1cbb"));

            migrationBuilder.DropColumn(
                name: "Prefix",
                table: "Courses");

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("3244a79f-792d-49db-9e98-bc02704d63f9"), null, new DateTime(2026, 3, 2, 10, 46, 41, 181, DateTimeKind.Utc).AddTicks(3170), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }
    }
}
