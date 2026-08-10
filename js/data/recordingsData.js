/**
 * js/data/recordingsData.js
 * Static data for training path recordings.
 * Organized by stage → paths → meetings.
 *
 * To add a new recording:
 *  1. Find (or create) the stage entry in RECORDINGS_DATA.
 *  2. Find (or create) the path under that stage.
 *  3. Add a meeting object with { title, url }.
 *     - url: the SharePoint sharing link for the Teams recording.
 *
 * The embed URL is auto-generated from the sharing link at render time.
 */

export const RECORDINGS_DATA = [
  {
    stageKey: "lower-primary",
    stageLabel: "الابتدائية الأولية",
    stageIcon: "ti-star",
    paths: [
      {
        name: "مسار التجويد",
        meetings: [
          {
            title: "اللقاء رقم 1",
            url: "https://ibnalmobarakorg-my.sharepoint.com/:v:/g/personal/h_batayah_ibnalmobarak_org/IQAZKUJi5RJaSqu13RLeOsyYAZHdrVAubEmZ9LqssrWVaXM?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=j0ixed",
          },
          {
            title: "اللقاء رقم 2",
            url: "https://ibnalmobarakorg-my.sharepoint.com/:v:/g/personal/h_batayah_ibnalmobarak_org/IQAZKUJi5RJaSqu13RLeOsyYAZHdrVAubEmZ9LqssrWVaXM?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=j0ixed",
          },
        ],
      },
      {
        name: "مسار الحفظ",
        meetings: [
          {
            title: "اللقاء رقم 1",
            url: "https://ibnalmobarakorg-my.sharepoint.com/:v:/g/personal/h_batayah_ibnalmobarak_org/IQAZKUJi5RJaSqu13RLeOsyYAZHdrVAubEmZ9LqssrWVaXM?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=j0ixed",
          },
        ],
      },
    ],
  },
  {
    stageKey: "all-remaining",
    stageLabel: "الثانوية - المتوسطة - الابتدائية العليا",
    stageIcon: "ti-books",
    paths: [
      {
        name: "مسار التلاوة",
        meetings: [
          {
            title: "اللقاء رقم 1",
            url: "https://ibnalmobarakorg-my.sharepoint.com/:v:/g/personal/h_batayah_ibnalmobarak_org/IQAZKUJi5RJaSqu13RLeOsyYAZHdrVAubEmZ9LqssrWVaXM?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=j0ixed",
          },
        ],
      },
      {
        name: "مسار التفسير",
        meetings: [
          {
            title: "اللقاء رقم 1",
            url: "https://ibnalmobarakorg-my.sharepoint.com/:v:/g/personal/h_batayah_ibnalmobarak_org/IQAZKUJi5RJaSqu13RLeOsyYAZHdrVAubEmZ9LqssrWVaXM?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=j0ixed",
          },
        ],
      },
      {
        name: "مسار العقيدة",
        meetings: [
          {
            title: "اللقاء رقم 1",
            url: "https://ibnalmobarakorg-my.sharepoint.com/:v:/g/personal/h_batayah_ibnalmobarak_org/IQAZKUJi5RJaSqu13RLeOsyYAZHdrVAubEmZ9LqssrWVaXM?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJTdHJlYW1XZWJBcHAiLCJyZWZlcnJhbFZpZXciOiJTaGFyZURpYWxvZy1MaW5rIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXcifX0%3D&e=j0ixed",
          },
        ],
      },
    ],
  },
];


