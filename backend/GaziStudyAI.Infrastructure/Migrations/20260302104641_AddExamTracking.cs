using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaziStudyAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExamTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("6ec11cc2-22d2-4db0-8d4c-b5d2b42f0f78"));

            migrationBuilder.AddColumn<int>(
                name: "AttemptNumber",
                table: "Exams",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "SessionId",
                table: "Exams",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("3244a79f-792d-49db-9e98-bc02704d63f9"), null, new DateTime(2026, 3, 2, 10, 46, 41, 181, DateTimeKind.Utc).AddTicks(3170), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("3244a79f-792d-49db-9e98-bc02704d63f9"));

            migrationBuilder.DropColumn(
                name: "AttemptNumber",
                table: "Exams");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "Exams");

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("6ec11cc2-22d2-4db0-8d4c-b5d2b42f0f78"), null, new DateTime(2026, 2, 25, 13, 49, 48, 935, DateTimeKind.Utc).AddTicks(8952), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }
    }
}
