package com.mylineup.events;

import java.time.LocalDate;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class EventForm {

    @RestForm
    public String name;

    @RestForm
    public LocalDate startDate;

    @RestForm
    public LocalDate endDate;

    @RestForm
    public String description;

    @RestForm
    public String homepage;

    @RestForm
    public String street;

    @RestForm
    public String postalCode;

    @RestForm
    public String city;

    @RestForm
    public String country;

    @RestForm
    public boolean showOnMap;

    @RestForm
    public LocalDate mapVisibleFrom;

    @RestForm("logo")
    public FileUpload logo;

    @RestForm("flyer")
    public FileUpload flyer;
}
