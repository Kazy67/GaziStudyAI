using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaziStudyAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddingPasswordSaltToUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("b0e4e453-e20f-414d-a83b-fddb2436486a"));

            migrationBuilder.AddColumn<byte[]>(
                name: "PasswordSalt",
                table: "Users",
                type: "varbinary(max)",
                nullable: false,
                defaultValue: new byte[0]);

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("cf66e7bc-d926-4ce3-ae5a-040721f0b6dd"), null, new DateTime(2026, 2, 18, 5, 6, 56, 362, DateTimeKind.Utc).AddTicks(7754), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "EmailConfiguration",
                keyColumn: "Id",
                keyValue: new Guid("cf66e7bc-d926-4ce3-ae5a-040721f0b6dd"));

            migrationBuilder.DropColumn(
                name: "PasswordSalt",
                table: "Users");

            migrationBuilder.InsertData(
                table: "EmailConfiguration",
                columns: new[] { "Id", "CreatedBy", "CreatedDate", "DeletedBy", "DeletedDate", "EnableSsl", "IsActive", "Port", "SenderEmail", "SenderPassword", "SmtpServer", "UpdatedBy", "UpdatedDate" },
                values: new object[] { new Guid("b0e4e453-e20f-414d-a83b-fddb2436486a"), null, new DateTime(2026, 2, 16, 14, 35, 33, 159, DateTimeKind.Utc).AddTicks(2360), null, null, true, true, 587, "gazistudyai.project@gmail.com", "bonxwdxcmxywmqcx", "smtp.gmail.com", null, null });
        }
    }
}
